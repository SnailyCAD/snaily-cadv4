import { Controller, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { leoProperties } from "lib/leo/activeOfficer";
import { CREATE_911_CALL_EVENT } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";

export const incidentInclude = {
  creator: { include: leoProperties },
  officersInvolved: { include: leoProperties },
  events: true,
};

@Controller("/incidents/events")
@UseBeforeEach(IsAuth)
export class IncidentController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/:incidentId")
  async createIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_911_CALL_EVENT, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident || !incident.isActive) {
      throw new NotFound("incidentNotFound");
    }

    const event = await prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        description: data.description,
      },
    });

    this.socket.emitUpdateActiveIncident({
      ...incident,
      events: [...incident.events, event],
    });

    return event;
  }

  @Put("/:incidentId/:eventId")
  async updateIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @PathParams("eventId") eventId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_911_CALL_EVENT, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident || !incident.isActive) {
      throw new NotFound("incidentNotFound");
    }

    const event = await prisma.incidentEvent.findFirst({
      where: {
        id: eventId,
        incidentId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    const updatedEvent = await prisma.incidentEvent.update({
      where: {
        id: event.id,
      },
      data: {
        description: data.description,
      },
    });

    const updatedEvents = incident.events.map((event) => {
      if (event.id === updatedEvent.id) {
        return updatedEvent;
      }
      return event;
    });

    this.socket.emitUpdateActiveIncident({
      ...incident,
      events: updatedEvents,
    });

    return updatedEvent;
  }

  @Delete("/:incidentId/:eventId")
  @Description("Delete an incident event by the incident id and event id")
  async deleteIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @PathParams("eventId") eventId: string,
  ) {
    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident || !incident.isActive) {
      throw new NotFound("incidentNotFound");
    }

    const event = await prisma.incidentEvent.findFirst({
      where: {
        id: eventId,
        incidentId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    await prisma.incidentEvent.delete({
      where: {
        id: event.id,
      },
    });

    const updatedEvents = incident.events.filter((v) => v.id !== event.id);

    this.socket.emitUpdateActiveIncident({ ...incident, events: updatedEvents });

    return true;
  }
}
