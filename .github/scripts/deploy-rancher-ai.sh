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

# Give the disconnection e2e tests an observable "unavailable" window by tearing down only the agent
# workloads (deployments), NOT the whole helm release. `helm uninstall` would also delete the
# rancher-mcp-server Service (and llm-mock Service) that ship in these charts; deleting and
# recreating them on every in-test reinstall churns ClusterIPs and leaves the service DNS names
# (e.g. rancher-mcp-server.<ns>.svc) intermittently unresolvable, so the agent controller fails to
# load MCP tools ("Name or service not known") and custom agents never reconcile to active - which
# flakes the multi-agent specs. Deleting just the deployments keeps the Services (and their DNS)
# stable; the `helm upgrade --install` calls below recreate the deleted deployments.
kubectl -n cattle-ai-agent-system delete deployment rancher-ai-agent llm-mock --ignore-not-found || true

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
