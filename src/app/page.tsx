import { getOrganizations } from '@/actions/organizations'
import HomeClient from './HomeClient'

export default async function Home() {
  const organizations = await getOrganizations()

  return <HomeClient organizations={organizations} />
}