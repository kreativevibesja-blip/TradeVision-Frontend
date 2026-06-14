import { FeedPostCard, CleanButton, CleanCard, CleanStatCard, PageHeader } from '@/components/CleanBlue';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const displayName = decodeURIComponent(params.id).replace(/[-_]/g, ' ') || 'Trader';

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-8 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <CleanCard className="mb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#DBEAFE] text-3xl font-extrabold text-[#2563EB]">{displayName[0]?.toUpperCase()}</div>
            <div className="flex-1">
              <PageHeader title={displayName} subtitle="Forex, Gold, Crypto · Shared setups, AI analyses, and market ideas." action={<CleanButton>Follow</CleanButton>} />
            </div>
          </div>
        </CleanCard>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <CleanStatCard label="Followers" value="1,284" />
          <CleanStatCard label="Following" value="318" />
          <CleanStatCard label="Shared Setups" value="92" />
        </div>
        <FeedPostCard author={displayName} image="/landing/platform-dashboard.png" />
      </div>
    </div>
  );
}
