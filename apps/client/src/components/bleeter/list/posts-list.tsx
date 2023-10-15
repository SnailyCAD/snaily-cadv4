import type { BleeterPost, BleeterProfile } from "@snailycad/types";
import { FullDate } from "@snailycad/ui";
import { Editor } from "components/editor/editor";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useList } from "hooks/shared/table/use-list";
import { useImageUrl } from "hooks/useImageUrl";
import Link from "next/link";

interface BleeterPostsListProps {
  posts: (BleeterPost & { creator?: BleeterProfile | null; user?: { username: string } })[];
  totalCount: number;
  creator?: BleeterProfile;
}

export function BleeterPostsList(props: BleeterPostsListProps) {
  const { makeImageUrl } = useImageUrl();
  const list = useList({
    initialData: props.posts,
    totalCount: props.totalCount,
  });

  return (
    <ul className="mt-5 space-y-3">
      {list.items.map((post) => {
        const creator = props.creator ?? post.creator;
        const creatorName = creator?.name ?? post.user?.username ?? "UNKNOWN";

        return (
          <li className="rounded-md shadow-sm" key={post.id}>
            <Link
              className="block p-4 card dark:hover:bg-secondary transition-colors"
              href={`/bleeter/${post.id}`}
            >
              <header className="flex gap-1 items-baseline">
                {creator ? (
                  <Link className="hover:underline" href={`/bleeter/@/${creator.handle}`}>
                    <h3 className="text-lg font-semibold">{creatorName}</h3>
                  </Link>
                ) : (
                  <h3 className="text-lg font-semibold">{creatorName}</h3>
                )}
                <span className="font-bold text-base">∙</span>
                <h4 className="text-base">
                  <FullDate relative>{post.createdAt}</FullDate>
                </h4>
              </header>

              <div className="mb-2 mt-3">
                <h2 className="text-xl font-bold">{post.title}</h2>

                <Editor hideBorder isReadonly value={post.bodyData} />
              </div>

              <div>
                {post.imageId ? (
                  <ImageWrapper
                    quality={80}
                    width={1600}
                    height={320}
                    alt={post.title}
                    placeholder={post.imageBlurData ? "blur" : "empty"}
                    blurDataURL={post.imageBlurData ?? undefined}
                    draggable={false}
                    className="max-h-[20rem] mb-5 w-full object-cover rounded-lg shadow-md"
                    src={makeImageUrl("bleeter", post.imageId)!}
                    loading="lazy"
                  />
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
