import {
  guideContent,
  homeContent,
  mapContent,
  profileContent,
  trainingContent,
} from '../data/mockData'
import type {
  GuideContent,
  HomeContent,
  MapContent,
  ProfileContent,
  TrainingContent,
} from '../lib/types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolveMock<T>(data: T, ms = 120): Promise<T> {
  await wait(ms)
  return structuredClone(data)
}

export const vitaApi = {
  getHomeContent(): Promise<HomeContent> {
    return resolveMock(homeContent, 80)
  },
  getGuideContent(): Promise<GuideContent> {
    return resolveMock(guideContent)
  },
  getMapContent(): Promise<MapContent> {
    return resolveMock(mapContent)
  },
  getTrainingContent(): Promise<TrainingContent> {
    return resolveMock(trainingContent)
  },
  getProfileContent(): Promise<ProfileContent> {
    return resolveMock(profileContent)
  },
}
