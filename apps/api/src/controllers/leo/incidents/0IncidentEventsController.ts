import { Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Post, Put } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { CALL_911_EVENT_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { Socket } from "services/socket-service";
import { incidentInclude } from "./IncidentController";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import type * as APITypes from "@snailycad/types/api";

@Controller("/incidents/events")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class IncidentEventsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/:incidentId")
  @Description("Create a new incident event.")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async createIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostIncidentEventsData> {
    const data = validateSchema(CALL_911_EVENT_SCHEMA, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident?.isActive) {
      throw new NotFound("incidentNotFound");
    }

    const event = await prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        description: data.description,
      },
    });

    const normalizedIncident = officerOrDeputyToUnit({
      ...incident,
      events: [...incident.events, event],
    });

    this.socket.emitUpdateActiveIncident(normalizedIncident);

    return normalizedIncident;
  }

  @Put("/:incidentId/:eventId")
  @Description("Update an incident event by the incident id and event id.")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async updateIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @PathParams("eventId") eventId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutIncidentEventByIdData> {
    const data = validateSchema(CALL_911_EVENT_SCHEMA, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident?.isActive) {
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

    const normalizedIncident = officerOrDeputyToUnit({
      ...incident,
      events: updatedEvents,
    });
    this.socket.emitUpdateActiveIncident(normalizedIncident);

    return normalizedIncident;
  }

  @Delete("/:incidentId/:eventId")
  @Description("Delete an incident event by the incident id and event id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async deleteIncidentEvent(
    @PathParams("incidentId") incidentId: string,
    @PathParams("eventId") eventId: string,
  ): Promise<APITypes.DeleteIncidentEventByIdData> {
    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!incident?.isActive) {
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

    const normalizedIncident = officerOrDeputyToUnit({ ...incident, events: updatedEvents });
    this.socket.emitUpdateActiveIncident(normalizedIncident);

    return normalizedIncident;
  }
}
