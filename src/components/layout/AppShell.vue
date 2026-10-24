<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { ChevronDown, Landmark, ListTodo, SearchCheck, ShieldCheck } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
const router = useRouter()

const destinations = [
  { path: '/executive', role: 'Executive', title: 'Exposure Snapshot', icon: Landmark },
  { path: '/management', role: 'Management', title: 'Priority Queue', icon: ListTodo },
  { path: '/analyst', role: 'Analyst', title: 'Entity Investigation', icon: SearchCheck },
  { path: '/sayari-debug', role: 'Developer', title: 'Sayari API Test', icon: ShieldCheck },
]

const currentDestination = computed(() =>
  destinations.find((destination) => destination.path === route.path) ?? destinations[0]!,
)

function switchRole(path: string) {
  void router.push(path)
}
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
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="destination in destinations" :key="destination.path">
                <SidebarMenuButton
                  as-child
                  :is-active="route.path === destination.path"
                  :tooltip="destination.role"
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

      <SidebarFooter class="border-t p-3 text-xs text-muted-foreground">
        <span class="group-data-[collapsible=icon]:hidden">Role-based workspaces</span>
      </SidebarFooter>
    </Sidebar>

    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger class="md:hidden" aria-label="Toggle sidebar" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ currentDestination.title }}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              data-testid="role-switcher"
              class="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs outline-none hover:bg-accent focus-visible:ring-2"
            >
              <span>{{ currentDestination.role }}</span>
              <ChevronDown class="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="destination in destinations"
              :key="destination.path"
              :data-testid="`role-option-${destination.role.toLowerCase()}`"
              @select="switchRole(destination.path)"
            >
              <component :is="destination.icon" />
              <span>{{ destination.role }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
