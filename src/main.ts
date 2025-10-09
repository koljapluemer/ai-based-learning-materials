import { createApp } from 'vue'
import App from './app/App.vue'
import { router } from './app/router'
import { createRepositories, installRepositories } from './app/repositories'

const app = createApp(App)

installRepositories(app, createRepositories())
app.use(router)

app.mount('#app')
