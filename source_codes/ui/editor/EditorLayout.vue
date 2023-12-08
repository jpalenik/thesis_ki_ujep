<template>
  <div class="wrapper editor">
    <transition name="fade" mode="out-in">
      <!-- your content here -->
      <router-view></router-view>
    </transition>
  </div>
</template>
<style lang="scss">

</style>
<script>
  import UserMenu from '@/components/UIComponents/SidebarPlugin/UserMenu.vue'
  import { mapState } from 'vuex'

  export default {
    components: {
      UserMenu,
    },
    methods: {
      toggleSidebar () {
        if (this.$sidebar.showSidebar) {
          this.$sidebar.displaySidebar(false)
        }
      }
    },
    computed: {
      annotationId: {
        get() {
          return this.$route.params.id
        }
      },
      ...mapState('editor', [
        'current_annotation'
      ]),
      selectedUserId: {
        get() {
          return this.$store.state.account.detail.user.id
        }
      }
    },
    async mounted() {

      // vuex example of setup
      await this.$store.dispatch('editor/setCurrentAnnotation', {
        annotation_id: this.annotationId
      })

      var html = document.getElementsByTagName("html");
      if(html.length){
        html[0].classList.add('editor-view')
      }
    },
    destroyed() {
      var html = document.getElementsByTagName("html");
      if(html.length){
        html[0].classList.remove('editor-view')
      }
    }
  }

</script>
