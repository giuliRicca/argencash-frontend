import { AccountDetailShell } from "@/components/account-detail-shell";

type AccountDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;

  return <AccountDetailShell accountId={id} />;
}
