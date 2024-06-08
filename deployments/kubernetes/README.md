# Kubernetes Deployment

Self Host Storage Browser in K8s

Powered By Helmwave, Stakater Application helm chart and Bedag Raw helm chart (for kong configurations)

## Requirements

* [Helmwave](https://helmwave.app)
* Ability to create namespace or having full access to namespace (named `storage-browser`)

## How to run

Set env vars like below

```shell
INGRESS_CLASS=nginx # Optional, name of the ingressClass special configs and annotations will set and applied if one of nginx or kong set
VERSION=main # Required, Branch name or tag
CERT_MANAGER_CLUSTER_ISSUER=http-issuer # Optional, name of cert-manager cluster-issuer (Required if you want HTTPS support)
DOMAIN=storage-browser.example.com # Required, Domain name of the deployment
```

Then run

```shell
# Template helmwave configuration
helmwave yml
# Build chart(s) information (values, etc.)
helmwave build
# Bring it Up
helmwave up --kubedog --progress
```
