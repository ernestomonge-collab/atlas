import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect directly to login for internal tool
  redirect('/login')
}
