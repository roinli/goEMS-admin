<template>
  <company-workspace initial-tab="info" :initial-company-id="companyId" />
</template>

<script>
import CompanyWorkspace from './CompanyWorkspace.vue'

export default {
  name: 'EmsSystemCompanyInfo',
  components: { CompanyWorkspace },
  computed: {
    companyId() {
      return this.$route.query.companyId
    }
  }
}
</script>
