variable "project" {}
variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "eks_cluster_version" {}
variable "eks_node_instance_type" {}
variable "eks_node_min" {}
variable "eks_node_max" {}
variable "eks_node_desired" {}
variable "node_role_arn" {}
variable "cluster_role_arn" {}
