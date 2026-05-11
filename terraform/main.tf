module "vpc" {
  source             = "./modules/vpc"
  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
}

module "iam" {
  source      = "./modules/iam"
  project     = var.project
  environment = var.environment
}

module "eks" {
  source                 = "./modules/eks"
  project                = var.project
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  eks_cluster_version    = var.eks_cluster_version
  eks_node_instance_type = var.eks_node_instance_type
  eks_node_min           = var.eks_node_min
  eks_node_max           = var.eks_node_max
  eks_node_desired       = var.eks_node_desired
  node_role_arn          = module.iam.node_role_arn
  cluster_role_arn       = module.iam.cluster_role_arn
}

module "s3" {
  source      = "./modules/s3"
  project     = var.project
  environment = var.environment
  account_id  = "051556733177"
}

module "secrets" {
  source      = "./modules/secrets"
  project     = var.project
  environment = var.environment
  db_username = var.db_username
}
