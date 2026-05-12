resource "aws_eks_cluster" "main" {
  name     = "${var.project}-cluster"
  role_arn = var.cluster_role_arn
  version  = var.eks_cluster_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  tags = {
    Name        = "${var.project}-cluster"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_eks_node_group" "app" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project}-app-nodes"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.eks_node_instance_type]
  ami_type       = "AL2_x86_64"

  scaling_config {
    desired_size = var.eks_node_desired
    min_size     = var.eks_node_min
    max_size     = var.eks_node_max
  }

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name        = "${var.project}-app-nodes"
    Project     = var.project
    Environment = var.environment
  }
}
