import { Feature, Rank, User } from "@snailycad/types";
import { DEFAULT_DISABLED_FEATURES } from "hooks/useFeatureEnabled";

interface VerifyUserConnectionsOptions {
  user: User;
  features: Record<Feature, boolean> | undefined | null;
}

export function doesUserHaveAllRequiredConnections(options: VerifyUserConnectionsOptions) {
  const steamId = options.user.steamId;
  const discordId = options.user.discordId;
  const isOwner = options.user.rank === Rank.OWNER;

  if (isOwner) {
    // owner does not require to have all connections
    return true;
  }

  const steamRequired =
    options.features?.[Feature.FORCE_STEAM_AUTH] ??
    DEFAULT_DISABLED_FEATURES.FORCE_STEAM_AUTH.isEnabled;

  const discordRequired =
    options.features?.[Feature.FORCE_DISCORD_AUTH] ??
    DEFAULT_DISABLED_FEATURES.FORCE_DISCORD_AUTH.isEnabled;

  const isFeatureEnabled = steamRequired || discordRequired;

  if (isFeatureEnabled) {
    const hasSteamConnection = Boolean(steamId?.trim()) && steamRequired;
    const hasDiscordConnection = Boolean(discordId?.trim()) && discordRequired;

    let hasConnection = false;

    if (steamRequired && discordRequired) {
      hasConnection = hasSteamConnection && hasDiscordConnection;
    } else if (steamRequired) {
      hasConnection = hasSteamConnection;
    } else if (discordRequired) {
      hasConnection = hasDiscordConnection;
    }

    return hasConnection;
  }

  return true;
}
