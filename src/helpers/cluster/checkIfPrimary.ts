import Cluster from '@/helpers/cluster/cluster'

export default function () {
  if (!Cluster.isPrimary) {
    throw new Error('This function can only be called from the primary')
  }
}
