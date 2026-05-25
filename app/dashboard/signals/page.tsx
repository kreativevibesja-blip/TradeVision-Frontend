import { redirect } from 'next/navigation';

export default function SignalsPage() {
  redirect('/dashboard/command-center');
}