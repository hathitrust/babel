import AccessStatusPanelStory from './AccessStatusPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/AccessStatusPanel',
  component: AccessStatusPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

//static date for testing UI and consistent chromatic snapshots, but takes in different times for testing that output
const expiresAt = (hours, minutes) => Math.floor(new Date(2026, 9, 14, hours, minutes).getTime() / 1000);

// one story per key in AccessStatusPanel/index.svelte's `subviews` map

export const TotalAccess = {
  args: {
    accessType: { granted: true, name: 'total_access', role: 'ht_total_user' },
  },
};

export const ResourceSharingUser = {
  args: {
    accessType: { granted: true, name: 'resource_sharing_user' },
  },
};

export const EnhancedTextUser = {
  args: {
    accessType: { granted: true, name: 'ssd_session_user' },
  },
};

// testing a morning (AM) time
export const EmergencyAccessAffiliate = {
  args: {
    accessType: {
      granted: true,
      name: 'emergency_access_affiliate',
      expires: expiresAt(9, 5),
      action: '#',
    },
  },
};

// testing an afternoon (PM) time
export const InLibraryUser = {
  args: {
    accessType: {
      granted: true,
      name: 'in_library_user',
      expires: expiresAt(15, 45),
      action: '#',
    },
  },
};

// testing noon
export const InLibraryUserNoon = {
  args: {
    accessType: {
      granted: true,
      name: 'in_library_user',
      expires: expiresAt(12, 30),
      action: '#',
    },
  },
};

// testing just after midnight
export const InLibraryUserMidnight = {
  args: {
    accessType: {
      granted: true,
      name: 'in_library_user',
      expires: expiresAt(0, 5),
      action: '#',
    },
  },
};
