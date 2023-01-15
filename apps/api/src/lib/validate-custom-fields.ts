import { LEO_CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import { prisma } from "./data/prisma";
import { validateSchema } from "./data/validate-schema";

export async function validateCustomFields(body: unknown) {
  const data = validateSchema(LEO_CUSTOM_FIELDS_SCHEMA, body);

  const createdFields = [];
  for (const fieldName in data) {
    const fieldData = data[fieldName];

    if (!fieldData) {
      continue;
    }

    const customField = await prisma.customField.findUnique({
      where: { id: fieldData.fieldId },
    });

    if (!customField) {
      continue;
    }

    const createUpdateData = {
      value: fieldData.value ?? null,
      fieldId: customField.id,
    };

    const created = await prisma.customFieldValue.upsert({
      where: {
        id: String(fieldData.valueId),
      },
      create: createUpdateData,
      update: createUpdateData,
      include: { field: true },
    });

    createdFields.push(created);
  }

  return createdFields;
}
