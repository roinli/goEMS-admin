<template>
  <company-workspace initial-tab="form" :initial-company-id="companyId" />
</template>

<script>
import CompanyWorkspace from './CompanyWorkspace.vue'

export default {
  name: 'EmsSystemCompanyEdit',
  components: { CompanyWorkspace },
  computed: {
    companyId() {
      return this.$route.query.companyId
    }
  }
}
</script>
