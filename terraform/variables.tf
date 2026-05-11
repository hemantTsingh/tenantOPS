variable "aws_region" {
  default = "ap-south-1"
}

variable "project" {
  default = "tenantops"
}

variable "environment" {
  default = "production"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  default = ["ap-south-1a", "ap-south-1b"]
}

variable "private_subnets" {
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnets" {
  default = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "eks_cluster_version" {
  default = "1.29"
}

variable "eks_node_instance_type" {
  default = "t3.medium"
}

variable "eks_node_min" {
  default = 2
}

variable "eks_node_max" {
  default = 4
}

variable "eks_node_desired" {
  default = 2
}

variable "db_username" {
  default = "tenantops_admin"
}
