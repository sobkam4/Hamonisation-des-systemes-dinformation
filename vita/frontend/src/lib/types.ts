export type TabId = 'home' | 'guide' | 'map' | 'training' | 'profile'

export type GuideFilter = 'Tous' | 'Réanimation' | 'Obstruction' | 'Traumatisme'
export type MapFilter = 'Tous' | 'DAE' | 'Hôpitaux' | 'Pharmacies'
export type TrainingFilter = 'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé'

export type AccentTone = 'danger' | 'info' | 'success' | 'warning' | 'brand'

export type IconName =
  | 'activity'
  | 'alert'
  | 'award'
  | 'book'
  | 'building'
  | 'check'
  | 'droplets'
  | 'flame'
  | 'heart'
  | 'map'
  | 'pill'
  | 'shield'
  | 'siren'
  | 'user'
  | 'wind'
  | 'zap'

export type Protocol = {
  title: string
  category: Exclude<GuideFilter, 'Tous'>
  duration: string
  level: string
  icon: IconName
  accent: AccentTone
}

export type Resource = {
  title: string
  subtitle: string
  category: Exclude<MapFilter, 'Tous'>
  distance: string
  status: string
  icon: IconName
  accent: AccentTone
}

export type Course = {
  title: string
  category: Exclude<TrainingFilter, 'Tous'>
  duration: string
  badge: string
  reward: string
  icon: IconName
  accent: AccentTone
  action?: 'play'
}

export type Shortcut = {
  title: string
  subtitle: string
  icon: IconName
  accent: AccentTone
  target: TabId
}

export type HomeContent = {
  title: string
  subtitle: string
  shortcuts: Shortcut[]
}

export type GuideContent = {
  title: string
  subtitle: string
  filters: GuideFilter[]
  protocols: Protocol[]
}

export type MapContent = {
  title: string
  subtitle: string
  filters: MapFilter[]
  resources: Resource[]
}

export type TrainingSummary = {
  completed: number
  total: number
}

export type TrainingContent = {
  title: string
  subtitle: string
  filters: TrainingFilter[]
  summary: TrainingSummary
  courses: Course[]
}

export type ProfileSection = {
  title: string
  icon: IconName
  accent: AccentTone
  items: string[]
}

export type ProfileMetric = {
  title: string
  subtitle: string
  icon: IconName
  accent: AccentTone
}

export type ProfileContent = {
  title: string
  subtitle: string
  name: string
  meta: string
  bloodGroup: string
  donorStatus: string
  allergies: string[]
  conditions: string[]
  medications: string[]
  metrics: ProfileMetric[]
  sections: ProfileSection[]
}
