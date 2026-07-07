#!/bin/bash

# Helper script to install the AI Assistant Helm chart into a Kubernetes cluster
#
# The LLM is configured to use a mock service for testing purposes.

KUBECONFIG_PATH=$1

if [ -z "$2" ]; then
  WAIT_FOR_AI_SERVICE_READY=true
else
  WAIT_FOR_AI_SERVICE_READY=$2
fi

if [ -z "$3" ]; then
  FETCH_REPOS=true
else
  FETCH_REPOS=$3
fi

HELM_WAIT_FLAGS=""
if [ "$WAIT_FOR_AI_SERVICE_READY" = "true" ]; then
  HELM_WAIT_FLAGS="--wait --timeout 5m"
fi

if [ -z "$KUBECONFIG_PATH" ]; then
  echo "ERROR: kubeconfig path required (arg or KUBECONFIG env)"
  usage
fi

if [ ! -f "$KUBECONFIG_PATH" ]; then
  echo "ERROR: kubeconfig not found at $KUBECONFIG_PATH"
  exit 2
fi

export KUBECONFIG="$KUBECONFIG_PATH"

# DIAGNOSTIC (temporary): trace the teardown from this script's own vantage so we can see
# whether kubectl/helm here actually reach & delete the deployment the poller watches.
TD_LOG="$(pwd)/agent-teardown.log"
td() { echo "[$(date +%s%3N)] $*" >> "$TD_LOG"; }
td "=== deploy-rancher-ai.sh start (WAIT=$WAIT_FOR_AI_SERVICE_READY FETCH=$FETCH_REPOS KUBECONFIG=$KUBECONFIG_PATH) ==="
td "kubectl version/context: $(kubectl config current-context 2>&1)"
td "helm list -n cattle-ai-agent-system:"; helm list -n cattle-ai-agent-system >> "$TD_LOG" 2>&1
td "deploy before teardown:"; kubectl -n cattle-ai-agent-system get deploy -o wide >> "$TD_LOG" 2>&1

helm uninstall ai-agent -n cattle-ai-agent-system >> "$TD_LOG" 2>&1 || td "helm uninstall ai-agent failed (rc=$?)"
helm uninstall llm-mock -n cattle-ai-agent-system >> "$TD_LOG" 2>&1 || td "helm uninstall llm-mock failed (rc=$?)"

# Force a real teardown of the agent workload before reinstalling. `helm uninstall`
# above is a no-op when the release isn't visible from the (Rancher-proxied) kubeconfig
# the e2e reinstall uses - the deployment then just gets patched in place on reinstall
# and never goes down, so the disconnection tests have no observable "unavailable"
# window. Deleting the deployment directly guarantees that window in every environment.
kubectl -n cattle-ai-agent-system delete deployment rancher-ai-agent llm-mock --ignore-not-found >> "$TD_LOG" 2>&1 || td "kubectl delete failed (rc=$?)"
td "deploy immediately after delete:"; kubectl -n cattle-ai-agent-system get deploy -o wide >> "$TD_LOG" 2>&1

if [ "$FETCH_REPOS" = "true" ]; then
  rm -rf rancher-ai-agent
  rm -rf rancher-ai-llm-mock

  git clone https://github.com/rancher/rancher-ai-agent.git
  git clone https://github.com/rancher-sandbox/rancher-ai-llm-mock.git
fi

helm upgrade --install llm-mock ./rancher-ai-llm-mock/chart/llm-mock \
  --namespace cattle-ai-agent-system \
  --create-namespace \
  --wait --timeout 1m

kubectl -n cattle-ai-agent-system rollout status deployment/llm-mock --timeout=1m
kubectl -n cattle-ai-agent-system wait --for=condition=available --timeout=1m deployment/llm-mock

helm upgrade --install ai-agent ./rancher-ai-agent/chart/agent \
  --namespace cattle-ai-agent-system \
  --create-namespace \
  --set global.cattle.systemDefaultRegistry=stgregistry.suse.com \
  --set googleApiKey=empty \
  --set ollamaUrl="http://localhost:11434" \
  --set ollamaLlmModel=ollama \
  --set activeLlm=ollama \
  --set llmMock.enabled=true \
  --set llmMock.url=http://llm-mock \
  --set insecureSkipTls=true \
  --set log.level=debug \
  $HELM_WAIT_FLAGS

if [ "$WAIT_FOR_AI_SERVICE_READY" = "true" ]; then
  kubectl -n cattle-ai-agent-system rollout status deployment/rancher-ai-agent --timeout=5m
  kubectl -n cattle-ai-agent-system wait --for=condition=available --timeout=5m deployment/rancher-ai-agent
fi
