<script>
  import { getContext, onMount } from 'svelte';
  import NotificationsManager from '~firebird-common/src/js/lib/notifications';
  import { consent } from '~firebird-common/src/js/lib/store.svelte.js';

  import Panel from '../Panel';

  const HT = getContext('HT');
  const prefs = HT.prefs.get();
  prefs.pt = prefs.pt || {};
  prefs.pt.alerts = prefs.pt.alerts || {};

  let hasSurveys = false;
  let notificationsModal;
  let notificationsManager = new NotificationsManager({
    cookieJar: HT.cookieJar,
  });
  window.xn = notificationsManager;

  function isExpanded(survey) {
    let id = survey.id;
    return prefs.pt.alerts[id] != 'closed';
  }

  function onToggle(event, open) {
    let id = this.id;
    prefs.pt.alerts[id] = open ? 'open' : 'closed';
    if (consent.preferencesConsent === 'true') {
      HT.prefs.set(prefs);
    }
    console.log('-- survey.panel.toggle', id, open);
  }

  onMount(() => {
    if (HT.login_status && HT.login_status.notificationData) {
      notificationsManager.update(HT.login_status.notificationData);
      hasSurveys = notificationsManager.hasSurveys();
    }
  });
</script>

{#if hasSurveys}
  <!-- <div class="accordion"> -->
  {#each notificationsManager.surveyData as survey}
    <Panel expanded={isExpanded(survey)} class="dark" id={survey.id} onToggle={onToggle.bind(survey)}>
      <i class="fa-solid fa-square-poll-vertical" slot="icon"></i>
      <slot:fragment slot="title">{survey.title}</slot:fragment>
      <slot:fragment slot="body">
        {#if survey.message.indexOf('<p>') > -1}
          {@html survey.message}
        {:else}
          <p>{survey.message}</p>
        {/if}
        <p>
          <a href={survey.read_more_link} target="_blank">{survey.read_more_label}</a>
        </p>
      </slot:fragment>
    </Panel>
  {/each}
  <!-- </div> -->
{/if}
