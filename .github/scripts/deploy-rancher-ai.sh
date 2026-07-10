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

helm uninstall ai-agent -n cattle-ai-agent-system || true
helm uninstall llm-mock -n cattle-ai-agent-system || true

# Force a real teardown of the agent workload before reinstalling, so the disconnection e2e
# tests get an observable "unavailable" window regardless of helm release bookkeeping.
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

# Probe tuning for the shared CI runner. The agent is a single-worker ASGI process serving the chat
# WebSocket, message processing AND the probe endpoints (/v1/api/health, /v1/api/readiness) from the
# same event loop. Under load that worker can't answer the probes in time; with default thresholds
# k8s restarts the pod, dropping active chat WebSockets and cascading test failures. Make liveness/
# readiness lenient so transient starvation doesn't restart the pod or pull it from the Service (the
# agent recovers on its own once CPU frees up), and keep the startup probe patient so a slow runner
# boot doesn't restart-loop.
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
  --set probes.startup.periodSeconds=5 \
  --set probes.startup.failureThreshold=60 \
  --set probes.liveness.periodSeconds=20 \
  --set probes.liveness.timeoutSeconds=10 \
  --set probes.liveness.failureThreshold=30 \
  --set probes.readiness.periodSeconds=15 \
  --set probes.readiness.timeoutSeconds=10 \
  --set probes.readiness.failureThreshold=30 \
  $HELM_WAIT_FLAGS

if [ "$WAIT_FOR_AI_SERVICE_READY" = "true" ]; then
  kubectl -n cattle-ai-agent-system rollout status deployment/rancher-ai-agent --timeout=5m
  kubectl -n cattle-ai-agent-system wait --for=condition=available --timeout=5m deployment/rancher-ai-agent
fi
