<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Landmark, ListTodo, SearchCheck, ShieldCheck } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const route = useRoute()

const destinations = [
  { path: '/executive', title: 'Exposure Snapshot', icon: Landmark },
  { path: '/management', title: 'Risk Breakdown', icon: ListTodo },
  { path: '/analyst', title: 'Entity Investigation', icon: SearchCheck },
]

const currentDestination = computed(
  () =>
    destinations.find((destination) => route.path.startsWith(destination.path)) ?? destinations[0]!,
)
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader class="h-16 border-b px-3">
        <div class="flex h-full items-center gap-2 font-semibold">
          <ShieldCheck class="size-5 text-primary" />
          <span>Entity Analysis</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="destination in destinations" :key="destination.path">
                <SidebarMenuButton
                  as-child
                  :is-active="route.path === destination.path"
                  :tooltip="destination.title"
                >
                  <RouterLink :to="destination.path">
                    <component :is="destination.icon" />
                    <span>{{ destination.title }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>

    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger class="md:hidden" aria-label="Toggle sidebar" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ currentDestination.title }}</p>
        </div>
      </header>

      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
