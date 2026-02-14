import JoinPageClient from "./join-page-client";

type JoinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawCode = params.code;
  const prefillCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  return <JoinPageClient prefillCode={prefillCode ?? ""} />;
}
