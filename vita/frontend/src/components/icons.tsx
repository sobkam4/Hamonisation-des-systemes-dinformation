import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  CircleAlert,
  Droplets,
  Flame,
  Heart,
  MapPin,
  Pill,
  Shield,
  Siren,
  User,
  Wind,
  Zap,
} from 'lucide-react'
import type { IconName } from '../lib/types'

const icons: Record<IconName, LucideIcon> = {
  activity: Activity,
  alert: CircleAlert,
  award: Award,
  book: BookOpen,
  building: Building2,
  check: CheckCircle2,
  droplets: Droplets,
  flame: Flame,
  heart: Heart,
  map: MapPin,
  pill: Pill,
  shield: Shield,
  siren: Siren,
  user: User,
  wind: Wind,
  zap: Zap,
}

type AppIconProps = LucideProps & {
  name: IconName
}

export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = icons[name]
  return <Icon {...props} />
}

export { Award, BookOpen, Heart, Lock, MapPin, Navigation, Pencil, PlayCircle, QrCode, Search, Trophy, User } from 'lucide-react'
