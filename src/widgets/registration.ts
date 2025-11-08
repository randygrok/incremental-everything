import {
  PropertyLocation,
  PropertyType,
  ReactRNPlugin,
} from '@remnote/plugin-sdk';
import {
  alwaysUseLightModeOnMobileId,
  alwaysUseLightModeOnWebId,
  collapseQueueTopBar,
  defaultPriorityId,
  displayPriorityShieldId,
  initialIntervalId,
  multiplierId,
  nextRepDateSlotCode,
  powerupCode,
  prioritySlotCode,
  remnoteEnvironmentId,
  repHistorySlotCode,
} from '../lib/consts';

/**
 * Registers the plugin's powerups with RemNote.
 *
 * Creates two powerups:
 * - Incremental: Main powerup for incremental reading with Priority, Next Rep Date, and History slots
 * - CardPriority: Powerup for flashcard prioritization with priority, source, and timestamp tracking
 */
export async function registerPowerups(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup({
    name: 'Incremental',
    code: powerupCode,
    description: 'Incremental Everything Powerup',
    options: {
      slots: [
        {
          code: prioritySlotCode,
          name: 'Priority',
          propertyType: PropertyType.NUMBER,
          propertyLocation: PropertyLocation.BELOW,
        },
        {
          code: nextRepDateSlotCode,
          name: 'Next Rep Date',
          propertyType: PropertyType.DATE,
          propertyLocation: PropertyLocation.BELOW,
        },
        {
          code: repHistorySlotCode,
          name: 'History',
          hidden: true,
        },
      ],
    },
  });

  await plugin.app.registerPowerup({
    name: 'CardPriority',
    code: 'cardPriority',
    description: 'Priority system for flashcards',
    options: {
      slots: [
        {
          code: 'priority',
          name: 'Priority',
          propertyType: PropertyType.NUMBER,
          propertyLocation: PropertyLocation.BELOW,
        },
        {
          code: 'prioritySource',
          name: 'Priority Source',
          propertyType: PropertyType.TEXT,
          propertyLocation: PropertyLocation.BELOW,
        },
        {
          code: 'lastUpdated',
          name: 'Last Updated',
          propertyType: PropertyType.NUMBER,
          hidden: true,
        }
      ],
    },
  });
}

/**
 * Registers all user-configurable plugin settings.
 *
 * Includes:
 * - Spaced repetition: initial interval, multiplier
 * - Default priorities: incremental rem, flashcards
 * - Performance: mode selection, platform-specific optimizations (mobile/web)
 * - UI preferences: collapse queue top bar, hide CardPriority tag, priority editor display
 * - Display: priority shield visibility
 * - Environment: RemNote instance selection (beta/www)
 *
 * Also applies conditional CSS to hide CardPriority tag if enabled.
 */
export async function registerSettings(plugin: ReactRNPlugin) {
  const hideCardPriorityTagId = 'hide-card-priority-tag';
  const HIDE_CARD_PRIORITY_CSS = `
    [data-rem-tags~="cardpriority"] .hierarchy-editor__tag-bar__tag {
    display: none; }
  `;

  plugin.settings.registerNumberSetting({
    id: initialIntervalId,
    title: 'Initial Interval',
    description: 'Sets the number of days until the first repetition.',
    defaultValue: 1,
  });

  plugin.settings.registerNumberSetting({
    id: multiplierId,
    title: 'Multiplier',
    description:
      'Sets the multiplier to calculate the next interval. Multiplier * previous interval = next interval.',
    defaultValue: 1.5,
  });

  plugin.settings.registerBooleanSetting({
    id: collapseQueueTopBar,
    title: 'Collapse Queue Top Bar',
    description:
      'Create extra space by collapsing the top bar in the queue. You can hover over the collapsed bar to open it.',
    defaultValue: true,
  });

  plugin.settings.registerBooleanSetting({
    id: 'hideCardPriorityTag',
    title: 'Hide CardPriority Tag in Editor',
    description:
      'If enabled, this will hide the "CardPriority" powerup tag in the editor to reduce clutter. You can still set priority with (Alt+P). After changing this setting, reload RemNote.',
    defaultValue: true,
  });

  plugin.settings.registerNumberSetting({
    id: defaultPriorityId,
    title: 'Default Priority',
    description: 'Sets the default priority for new incremental rem (0-100, Lower = more important). Default: 10',
    defaultValue: 10,
    validators: [
      { type: "int" as const },
      { type: "gte" as const, arg: 0 },
      { type: "lte" as const, arg: 100 },
    ]
  });

  plugin.settings.registerNumberSetting({
    id: 'defaultCardPriority',
    title: 'Default Card Priority',
    description: 'Default priority for flashcards without inherited priority (0-100, Lower = more important).  Default: 50',
    defaultValue: 50,
    validators: [
      { type: "int" as const },
      { type: "gte" as const, arg: 0 },
      { type: "lte" as const, arg: 100 },
    ]
  });

  plugin.settings.registerDropdownSetting({
    id: 'performanceMode',
    title: 'Performance Mode',
    description: 'Choose performance level. "Light" is recommended for web/mobile. "Full" can bring significant computational overhead (best used in the Desktop App); it will also automatically start a pretagging process of all flashcards, that can make RemNote slow until everything is tagged/synced/wired/cached!',
    defaultValue: 'light',
    options: [
      {
        key: 'full',
        label: 'Full (All Features, High Resource Use)',
        value: 'full'
      },
      {
        key: 'light',
        label: 'Light (Faster, No Relative Priority/Shield)',
        value: 'light'
      }
    ]
  });

  plugin.settings.registerBooleanSetting({
    id: alwaysUseLightModeOnMobileId,
    title: 'Always use Light Mode on Mobile',
    description: 'Automatically switch to Light performance mode when using RemNote on iOS or Android. This prevents crashes and improves performance on mobile devices. Recommended: enabled.',
    defaultValue: true,
  });

  plugin.settings.registerBooleanSetting({
    id: alwaysUseLightModeOnWebId,
    title: 'Always use Light Mode on Web Browser',
    description: 'Automatically switch to Light performance mode when using RemNote on the web browser. Full Mode can be slow or unstable on web browsers. Recommended: enabled.',
    defaultValue: true,
  });

  plugin.settings.registerBooleanSetting({
    id: displayPriorityShieldId,
    title: 'Display Priority Shield in Queue',
    description: 'If enabled, shows a real-time status of your highest-priority due items in the queue (below the Answer Buttons for IncRems, and in the card priority widget under the flashcard in case of regular cards).',
    defaultValue: true,
  });

  plugin.settings.registerDropdownSetting({
    id: 'priorityEditorDisplayMode',
    title: 'Priority Editor in Editor',
    description:
      'Controls when to show the priority widget in the right-hand margin of the editor.',
    defaultValue: 'all',
    options: [
      {
        key: 'all',
        label: 'Show for IncRem and Cards',
        value: 'all',
      },
      {
        key: 'incRemOnly',
        label: 'Show only for IncRem',
        value: 'incRemOnly',
      },
      {
        key: 'disable',
        label: 'Disable',
        value: 'disable',
      },
    ],
  });

  plugin.settings.registerDropdownSetting({
    id: remnoteEnvironmentId,
    title: 'RemNote Environment',
    description: 'Choose which RemNote environment to open documents in (beta.remnote.com or www.remnote.com)',
    defaultValue: 'www',
    options: [
      {
        key: 'beta',
        label: 'Beta (beta.remnote.com)',
        value: 'beta'
      },
      {
        key: 'www',
        label: 'Regular (www.remnote.com)',
        value: 'www'
      }
    ]
  });

  // Apply the CSS hide setting on startup
  const shouldHide = await plugin.settings.getSetting('hideCardPriorityTag');
  if (shouldHide) {
    await plugin.app.registerCSS(hideCardPriorityTagId, HIDE_CARD_PRIORITY_CSS);
  }
}
