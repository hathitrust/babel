import AccessStatusPanelStory from './AccessStatusPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/AccessStatusPanel',
  component: AccessStatusPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

const oneHourFromNow = () => Math.floor(Date.now() / 1000) + 3600;

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

export const EmergencyAccessAffiliate = {
  args: {
    accessType: {
      granted: true,
      name: 'emergency_access_affiliate',
      expires: oneHourFromNow(),
      action: '#',
    },
  },
};

export const InLibraryUser = {
  args: {
    accessType: {
      granted: true,
      name: 'in_library_user',
      expires: oneHourFromNow(),
      action: '#',
    },
  },
};
