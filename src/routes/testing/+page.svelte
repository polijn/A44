<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Dynamically inject the script only on client
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);
  });
</script>

<!-- Voice Widget -->
<vapi-widget
  mode="voice"
  theme="light"
  base-color="#ffffff"
  accent-color="#14B8A6"
  button-base-color="#f40707"
  button-accent-color="#ffffff"
  radius="large"
  size="full"
  position="top-left"
  main-label="TALK WITH AI"
  start-button-text="Start"
  end-button-text="End Call"
  require-consent="true"
  local-storage-key="vapi_widget_consent"
  show-transcript="true"
  public-key="77df2139-6329-4f96-9b08-4394fbfb865f"
  assistant-id="07e86b06-989e-40da-b09f-acde9377d6b5">
</vapi-widget>

<!-- Chat Widget -->
<vapi-widget
  mode="chat"
  theme="light"
  base-color="#ffffff"
  accent-color="#14B8A6"
  button-base-color="#2107f5"
  button-accent-color="#ffffff"
  radius="large"
  size="full"
  position="top-right"
  main-label="chat WITH AI"
  start-button-text="Start"
  end-button-text="End Call"
  require-consent="true"
  local-storage-key="vapi_widget_consent"
  show-transcript="true"
  public-key="77df2139-6329-4f96-9b08-4394fbfb865f"
  assistant-id="07e86b06-989e-40da-b09f-acde9377d6b5">
</vapi-widget>
