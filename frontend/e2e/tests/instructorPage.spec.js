import { test, expect } from '../test'
import {
  loginAsAdmin,
  createGroup,
  createPeerReviews,
  deleteAllGroups,
  deleteAllPeerReviews,
} from '../helpers'

const withApi = async (playwright, fn) => {
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL })
  await fn(request)
  await request.dispose()
}

const initTests = async (request) => {
  await createGroup(request, {
    name: 'Tykittelijät',
    topicId: 1,
    configurationId: 1,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  await createGroup(request, {
    name: 'Kakkostykitys',
    topicId: 3,
    configurationId: 1,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  await createGroup(request, {
    name: 'Kämmäilijät',
    topicId: 2,
    configurationId: 2,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  const konf1vastaukset1 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 1,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '3',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '2',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 3,
              'Timo *Teppo Tellervo Testaaja': 1,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 1,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '4',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '3',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 2,
              'Timo *Teppo Tellervo Testaaja': 1,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  const konf1vastaukset2 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 1,
        review_round: 2,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '3',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '2',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 4,
              'Timo *Teppo Tellervo Testaaja': 4,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 1,
        review_round: 2,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '4',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '5',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 5,
              'Timo *Teppo Tellervo Testaaja': 5,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  const konf2vastaukset1 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 2,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '0',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '0',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 0,
              'Timo *Teppo Tellervo Testaaja': 0,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 2,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '0',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '0',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 0,
              'Timo *Teppo Tellervo Testaaja': 0,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  await createPeerReviews(request, konf1vastaukset1)
  await createPeerReviews(request, konf1vastaukset2)
  await createPeerReviews(request, konf2vastaukset1)
}

const selectConfiguration = async (page, name) => {
  await page.locator('[data-cy=configuration-selector]').click()
  await page.locator('.configuration-menu-item', { hasText: name }).click()
}

const selectGroup = async (page, name) => {
  await page.locator('[data-cy=group-selector]').click()
  await page.locator('.specified-group-menu-item', { hasText: name }).click()
}

const shows = (page, text) => expect(page.getByText(text).first()).toBeVisible()

test.describe('Instructor page', () => {
  test.beforeAll(async ({ playwright }) => {
    await withApi(playwright, async (request) => {
      await deleteAllGroups(request)
      await deleteAllPeerReviews(request)
      await initTests(request)
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('instructorpage')
  })

  test('shows correct url, contains configuration selector and displays its group', async ({
    page,
  }) => {
    // submit not successfull, still on same page
    await expect(page).toHaveURL(/\/instructorpage/)
    await selectConfiguration(page, 'Konfiguraatio 1')
    await shows(page, 'Tykittelijät')
    await shows(page, '3.00')
  })

  test('displays the corresponding groups of each configuration', async ({ page }) => {
    // submit not successfull, still on same page
    await selectConfiguration(page, 'Konfiguraatio 2')
    await shows(page, 'Kämmäilijät')
    await shows(page, 'This group has not answered to the second peer review round yet.')
    await selectConfiguration(page, 'Konfiguraatio 1')
    await shows(page, '4.00')
  })

  test('is loaded displaying all groups of a configuration', async ({ page }) => {
    await selectConfiguration(page, 'Konfiguraatio 1')
    await shows(page, 'Tykittelijät')
    await shows(page, 'Kakkostykitys')
  })

  test('can filter and display only one group at a time', async ({ page }) => {
    await selectConfiguration(page, 'Konfiguraatio 1')

    await selectGroup(page, 'Tykittelijät')
    await shows(page, 'Tykittelijät')
    await expect(page.locator('body')).not.toContainText('Kakkostykitys')

    await selectGroup(page, 'Kakkostykitys')
    await shows(page, 'Kakkostykitys')
    await expect(page.locator('body')).not.toContainText('Tykittelijät')
  })

  test('can toggle between student and question views', async ({ page }) => {
    await selectConfiguration(page, 'Konfiguraatio 1')
    await selectGroup(page, 'Tykittelijät')

    await page.getByText('Student View').first().click()
    await shows(page, 'Question View')
    await shows(page, '/ 1st Round')
    await shows(page, 'Tykittelijät')

    await page.getByText('Question View').first().click()
    await shows(page, 'Student View')
  })

  test.afterAll(async ({ playwright }) => {
    await withApi(playwright, async (request) => {
      await deleteAllGroups(request)
      await deleteAllPeerReviews(request)
    })
  })
})
