<template>
    <div class="mb-3">
        <label for="cw-api-url" class="form-label">API URL</label>
        <input
            id="cw-api-url"
            v-model="$parent.notification.cwApiUrl"
            type="text"
            class="form-control"
            placeholder="https://api-na.myconnectwise.net/v4_6_release/apis/3.0"
            required
        />
    </div>

    <div class="mb-3">
        <label for="cw-company-id" class="form-label">Company ID</label>
        <input
            id="cw-company-id"
            v-model="$parent.notification.cwCompanyId"
            type="text"
            class="form-control"
            required
        />
    </div>

    <div class="mb-3">
        <label for="cw-client-id" class="form-label">Client ID</label>
        <input
            id="cw-client-id"
            v-model="$parent.notification.cwClientId"
            type="text"
            class="form-control"
            required
        />
    </div>

    <div class="mb-3">
        <label for="cw-public-key" class="form-label">Public Key</label>
        <HiddenInput
            id="cw-public-key"
            v-model="$parent.notification.cwPublicKey"
            autocomplete="new-password"
            required
        />
    </div>

    <div class="mb-3">
        <label for="cw-private-key" class="form-label">Private Key</label>
        <HiddenInput
            id="cw-private-key"
            v-model="$parent.notification.cwPrivateKey"
            autocomplete="new-password"
            required
        />
    </div>

    <div class="form-text">
        Per-monitor settings (board, status, type, etc.) are configured in each monitor's edit page.
    </div>
</template>

<script>
import HiddenInput from "../HiddenInput.vue";

export default {
    components: {
        HiddenInput,
    },
    mounted() {
        const n = this.$parent.notification;
        if (n.cwApiUrl === undefined) {
            n.cwApiUrl = "";
        }
    },
};
</script>
