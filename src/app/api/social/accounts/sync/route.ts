const GET_ORGANIZATIONS_QUERY = `
  query GetOrganizations {
    account {
      organizations {
        id
        name
        ownerEmail
      }
    }
  }
`;

const GET_CHANNELS_QUERY = `
  query GetChannels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id
      name
      displayName
      service
      avatar
      isQueuePaused
    }
  }
`;

export async function POST() {
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  const orgRes = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bufferToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: GET_ORGANIZATIONS_QUERY }),
  });

  if (!orgRes.ok) {
    const detail = await orgRes.text();
    return Response.json({ error: "Buffer organization query failed", detail }, { status: 502 });
  }

  const orgData = await orgRes.json() as {
    data?: { account?: { organizations?: Array<{ id: string; name: string; ownerEmail?: string }> } };
    errors?: Array<{ message: string }>;
  };

  const organization = orgData.data?.account?.organizations?.[0];
  if (!organization) {
    return Response.json({
      error: "No Buffer organization found",
      detail: orgData.errors?.map((error) => error.message).join("; ") ?? null,
    }, { status: 502 });
  }

  const channelsRes = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bufferToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_CHANNELS_QUERY,
      variables: { organizationId: organization.id },
    }),
  });

  if (!channelsRes.ok) {
    const detail = await channelsRes.text();
    return Response.json({ error: "Buffer channels query failed", detail }, { status: 502 });
  }

  const channelsData = await channelsRes.json() as {
    data?: {
      channels?: Array<{
        id: string;
        name?: string;
        displayName?: string;
        service: string;
        avatar?: string;
        isQueuePaused?: boolean;
      }>;
    };
    errors?: Array<{ message: string }>;
  };

  const channels = channelsData.data?.channels;
  if (!channels) {
    return Response.json({
      error: "No Buffer channels returned",
      detail: channelsData.errors?.map((error) => error.message).join("; ") ?? null,
    }, { status: 502 });
  }

  const simplified = channels.map((channel) => ({
    buffer_profile_id: channel.id,
    platform: channel.service,
    display_name: channel.displayName ?? channel.name ?? channel.id,
    avatar: channel.avatar ?? null,
    is_queue_paused: channel.isQueuePaused ?? false,
    organization_id: organization.id,
    organization_name: organization.name,
  }));

  return Response.json({ profiles: simplified });
}
