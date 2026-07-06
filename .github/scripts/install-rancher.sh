#!/bin/bash

# Helper script to run Rancher on a local k3s cluster via Helm.
#
# Previously this installed Rancher as an all-in-one Docker container. It now
# installs a k3s cluster and deploys Rancher into it with Helm, mirroring the
# approach used by rancher/dashboard (see rancher/dashboard#10897).
#
# Usage: install-rancher.sh [VERSION] [CATTLE_SERVER_URL] [CATTLE_BOOTSTRAP_PASSWORD]
#
# On success a kubeconfig for the k3s cluster is written to ./kubeconfig.yaml.

set -e

VERSION="head"
CATTLE_SERVER_URL="https://127.0.0.1.sslip.io"
CATTLE_BOOTSTRAP_PASSWORD="password"

if [ -n "$1" ]; then
  VERSION=$1
fi

if [ -n "$2" ]; then
  CATTLE_SERVER_URL="$2"
fi

if [ -n "$3" ]; then
  CATTLE_BOOTSTRAP_PASSWORD="$3"
fi

# ---------------------------------
# ----------------------- Config
# ---------------------------------

KUBE_VERSION=${KUBE_VERSION:-v1.35.2+k3s1}
RANCHER_HELM_REPO_URL=${RANCHER_HELM_REPO_URL:-https://charts.optimus.rancher.io/server-charts/release-2.15}
RANCHER_HELM_REPO_NAME=rancher-helm
RANCHER_NAMESPACE=cattle-system

RANCHER_IMG_REGISTRY=${RANCHER_IMG_REGISTRY:-}
RANCHER_IMG_REPO=${RANCHER_IMG_REPO:-rancher/rancher}
RANCHER_IMG_TAG=${RANCHER_IMG_TAG:-$VERSION}
RANCHER_AGENT_IMG=${RANCHER_AGENT_IMG:-rancher/rancher-agent:$VERSION}

# - See https://ranchermanager.docs.rancher.com/how-to-guides/advanced-user-guides/enable-api-audit-log (0 off, 3 everything)
RANCHER_AUDIT_LOG_LEVEL=3

# Hostname Rancher advertises. Must match CATTLE_SERVER_URL so the login cookie
# and generated kubeconfigs are reachable from the test runner.
DASHBOARD_URL="${CATTLE_SERVER_URL#https://}"
KUBECONFIG_PATH="$(pwd)/kubeconfig.yaml"

echo "--------------------------------------"
echo "Installing Rancher with the following configuration:"
echo "  KUBE_VERSION:            ${KUBE_VERSION}"
echo "  RANCHER_HELM_REPO_URL:   ${RANCHER_HELM_REPO_URL}"
echo "  RANCHER_IMG_REPO:        ${RANCHER_IMG_REPO}"
echo "  RANCHER_IMG_TAG:         ${RANCHER_IMG_TAG}"
echo "  RANCHER_AGENT_IMG:       ${RANCHER_AGENT_IMG}"
echo "  CATTLE_SERVER_URL:       ${CATTLE_SERVER_URL}"
echo "  DASHBOARD_URL:           ${DASHBOARD_URL}"
echo "--------------------------------------"

# ---------------------------------
# ----------------------- Install k3s
# ---------------------------------

echo ""
echo "Installing k3s (${KUBE_VERSION}) ..."
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="$KUBE_VERSION" sh -

# k3s installs a `kubectl` symlink at /usr/local/bin/kubectl.
export KUBECONFIG="$KUBECONFIG_PATH"
sudo k3s kubectl config view --raw > "$KUBECONFIG"
sudo chown "$(id -u):$(id -g)" "$KUBECONFIG"
chmod 600 "$KUBECONFIG"

echo ""
echo "Waiting for k3s node to be ready ..."
kubectl wait --for=condition=Ready node --all --timeout=120s

# ---------------------------------
# ----------------------- Install Helm
# ---------------------------------

if ! command -v helm >/dev/null 2>&1; then
  echo ""
  echo "Installing helm ..."
  curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
  chmod 700 get_helm.sh
  ./get_helm.sh
fi

# ---------------------------------
# ----------------------- Cert manager
# ---------------------------------

echo ""
echo "Installing cert-manager ..."
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.7.1/cert-manager.crds.yaml
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.7.1 \
  --wait --timeout 5m

# ---------------------------------
# ----------------------- Install Rancher
# ---------------------------------

echo ""
echo "Setting up Rancher Helm repo ..."
helm repo add $RANCHER_HELM_REPO_NAME $RANCHER_HELM_REPO_URL
helm repo update

echo ""
echo "Installing Rancher ..."
kubectl create namespace $RANCHER_NAMESPACE
helm install rancher $RANCHER_HELM_REPO_NAME/rancher \
  --namespace $RANCHER_NAMESPACE \
  --devel \
  --set hostname=$DASHBOARD_URL \
  --set replicas="1" \
  --set systemDefaultRegistry=$RANCHER_IMG_REGISTRY \
  --set image.repository="$RANCHER_IMG_REPO" \
  --set image.tag="$RANCHER_IMG_TAG" \
  --set image.pullPolicy="Always" \
  --set auditLog.enabled=true \
  --set auditLog.level=$RANCHER_AUDIT_LOG_LEVEL \
  --set extraEnv\[0\].name="CATTLE_AGENT_IMAGE" \
  --set-string extraEnv\[0\].value="$RANCHER_AGENT_IMG" \
  --set extraEnv\[1\].name="CATTLE_BOOTSTRAP_PASSWORD" \
  --set-string extraEnv\[1\].value="$CATTLE_BOOTSTRAP_PASSWORD" \
  --set extraEnv\[2\].name="CATTLE_PASSWORD_MIN_LENGTH" \
  --set-string extraEnv\[2\].value="3"

# ----------------------------------------------------
# ----------------------- Wait for Rancher to be ready
# ----------------------------------------------------

echo ""
echo "Waiting for Rancher to come up ..."
kubectl -n $RANCHER_NAMESPACE rollout status deploy/rancher --timeout=10m

echo ""
echo "Waiting for Rancher API to be reachable at ${CATTLE_SERVER_URL} ..."
TIME=0
while [[ "$(curl --insecure -s -m 5 -o /dev/null -w ''%{http_code}'' ${CATTLE_SERVER_URL})" != "200" ]]; do
  sleep 5
  TIME=$((TIME + 5))
  echo "${TIME}s ..."
  if [ $TIME -ge 600 ]; then
    echo "Rancher did not become available in a reasonable time"
    exit 1
  fi
done

echo ""
echo "Waiting for rancher-webhook to be running ..."
okay=0
while [ $okay -lt 30 ]; do
  if kubectl -n $RANCHER_NAMESPACE get po -l app=rancher-webhook 2>/dev/null | grep -q '1/1.*Running'; then
    break
  fi
  echo "Webhook not ready, checking again in 10s ..."
  okay=$((okay + 1))
  sleep 10
done

echo ""
kubectl --kubeconfig="$KUBECONFIG_PATH" cluster-info
if [ $? -ne 0 ]; then
  echo "Unable to reach the k3s cluster"
  exit 1
fi

echo ""
echo "Done. kubeconfig written to ${KUBECONFIG_PATH}"
