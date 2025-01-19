import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import CompetitionList from "../views/CompetitionList.vue";
import CompetitionForm from "../views/CompetitionForm.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: CompetitionList,
  },
  { path: "/competitions/new", component: CompetitionForm },
  {
    path: "/competitions/:id",
    component: () =>
      import(
        /* webpackChunkName: "dashboard" */ "../views/CompetitionDashboard.vue"
      ),
    children: [
      {
        path: "archers",
        component: () =>
          import(
            /* webpackChunkName: "dashboard" */ "../views/ArchersList.vue"
          ),
      },
    ],
  },
  { path: "/competitions/:id/edit", component: CompetitionForm },
  {
    path: "/about",
    name: "about",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
