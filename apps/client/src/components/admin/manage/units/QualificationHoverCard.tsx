import type { UnitQualification } from "@snailycad/types";
import { HoverCard } from "components/shared/HoverCard";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useImageUrl } from "hooks/useImageUrl";

interface Props {
  qualification: UnitQualification;
}

export function QualificationsHoverCard({ qualification }: Props) {
  const { makeImageUrl } = useImageUrl();
  const imgUrl = makeImageUrl("values", qualification.qualification.imageId);

  const trigger = imgUrl ? (
    <ImageWrapper
      alt={qualification.qualification.value.value}
      loading="lazy"
      src={imgUrl}
      width={50}
      height={50}
      className="object-cover"
      fallback={<span className="cursor-default">—</span>}
      quality={70}
    />
  ) : (
    <span className="cursor-default">—</span>
  );

  if (!qualification.qualification.description) {
    return trigger;
  }

  return (
    <HoverCard trigger={trigger}>
      <div className="min-w-[250px] w-full max-w-[400px] flex flex-row gap-4">
        {imgUrl ? (
          <div className="min-w-[70px]">
            <ImageWrapper
              loading="lazy"
              src={imgUrl}
              width={70}
              height={70}
              className="object-cover rounded-sm"
              alt={qualification.qualification.value.value}
              quality={70}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl">{qualification.qualification.value.value}</h1>
          <p>{qualification.qualification.description}</p>
        </div>
      </div>
    </HoverCard>
  );
}
