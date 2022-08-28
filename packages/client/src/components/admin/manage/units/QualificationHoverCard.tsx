import type { UnitQualification } from "@snailycad/types";
import { HoverCard } from "components/shared/HoverCard";
import { useImageUrl } from "hooks/useImageUrl";
import Image from "next/future/image";

interface Props {
  qualification: UnitQualification;
}

export function QualificationsHoverCard({ qualification }: Props) {
  const { makeImageUrl } = useImageUrl();
  const imgUrl = makeImageUrl("values", qualification.qualification.imageId);

  const trigger = imgUrl ? (
    <Image loading="lazy" src={imgUrl} width={50} height={50} className="object-cover" />
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
            <Image
              loading="lazy"
              src={imgUrl}
              width={70}
              height={70}
              className="object-cover rounded-sm"
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
