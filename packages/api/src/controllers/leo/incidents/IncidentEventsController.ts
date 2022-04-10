import { Controller, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { CREATE_911_CALL_EVENT } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";
import { incidentInclude } from "./IncidentController";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";

@Controller("/incidents/events")
@UseBeforeEach(IsAuth)
export class IncidentController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/:incidentId")
  @Description("Create a new incident event.")
  @UsePermissions({
    permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
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

    const correctedIncident = officerOrDeputyToUnit({
      ...incident,
      events: [...incident.events, event],
    });

    this.socket.emitUpdateActiveIncident(correctedIncident);

    return event;
  }

  @Put("/:incidentId/:eventId")
  @Description("Update an incident event by the incident id and event id.")
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
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

    const correctedIncident = officerOrDeputyToUnit({
      ...incident,
      events: updatedEvents,
    });
    this.socket.emitUpdateActiveIncident(correctedIncident);

    return updatedEvent;
  }

  @Delete("/:incidentId/:eventId")
  @Description("Delete an incident event by the incident id and event id")
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
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

    const correctedIncident = officerOrDeputyToUnit({ ...incident, events: updatedEvents });
    this.socket.emitUpdateActiveIncident(correctedIncident);

    return true;
  }
}
