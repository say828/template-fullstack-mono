# GitOps Runtime Infrastructure Boundary

## Goal

Keep retained runtime infrastructure for `template` out of this application repository
and managed from `gitops`.

## Boundary

- This repository owns code, build logic, and local or experimental helper infrastructure.
- `gitops` owns retained runtime DNS, edge, Kubernetes delivery, and shared runtime infrastructure.
- New live runtime Terraform should not be introduced here.
