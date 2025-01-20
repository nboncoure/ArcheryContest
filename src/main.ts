import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import CompetitionList from './views/CompetitionList.vue'
import CompetitionForm from './views/CompetitionForm.vue'
import CompetitionDashboard from './views/CompetitionDashboard.vue'
import ImportArchers from './views/ImportArchers.vue'
import TargetAssignment from './views/TargetAssignment.vue'
import ArchersList from './views/ArchersList.vue'
import ScoreEntry from './views/ScoreEntry.vue'
import Rankings from './views/Rankings.vue'

const app = createApp(App)
const pinia = createPinia()

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: CompetitionList },
    { path: '/competitions/new', component: CompetitionForm },
    { 
      path: '/competition/:id', 
      component: CompetitionDashboard,
      children: [
        { path: 'archers', component: ArchersList },
        { path: 'import', component: ImportArchers },
        { path: 'targets', component: TargetAssignment },
        { path: 'scores', component: ScoreEntry },
        { path: 'rankings', component: Rankings }
      ]
    },
    { path: '/competition/:id/edit', component: CompetitionForm }
  ]
})

app.use(pinia)
app.use(router)
app.mount('#app')