import { test, expect } from '../test'
import {
  createConfiguration,
  createCustomerReview,
  createGroup,
  createTopic,
  deleteConfiguration,
  loginAsAdmin,
} from '../helpers'

const mockAnswers = [
  {
    type: 'info',
    header: 'Ohje',
    description:
      'Ohje: Anna avovastauksiin vapaamuotoiset perustelut arvosanaehdotuksille. Voit käyttääapuna vinkkeinä annettuna esimerkkejä asioista, joihin voi kiinnittää huomiota. Voit myöskertoa vapaasti muista mielestäsi olennaisista asioista. Arvioi jokainen ryhmäläinen. Kirjoitaitseäsi koskevat perustelut erityisen huolellisesti. Huomaa, että saadakseen kurssistaarvosanaksi 5 ei jokaisen osa alueen tarvitse olla täydellinen. On luontevaa, että ryhmässäkontribuutioden painopisteet jakautuvat eri tavoin ja tämä on täysin ok myös tällä kurssilla.',
  },
  {
    id: 1,
    type: 'number',
    answer: 5,
    questionHeader: 'Grade (scale 0-5)  ',
  },
  {
    id: 2,
    type: 'text',
    answer:
      'Your satisfaction to the resulting product compared to your intial expectations:Your satisfaction to the resulting product compared to your intial expectations:',
    questionHeader:
      'Your satisfaction to the resulting product compared to your intial expectations:',
  },
  {
    id: 3,
    type: 'text',
    answer:
      'Your satisfaction to the resulting product compared to your intial expectations:Your satisfaction to the resulting product compared to your intial expectations:',
    questionHeader: 'The quality of the product and fit for the purpose:',
  },
  {
    id: 4,
    type: 'text',
    answer:
      'Your satisfaction to the resulting product compared to your intial expectations:Your satisfaction to the resulting product compared to your intial expectations:',
    questionHeader: 'What was the technical skill level of the team compared to your expectations?',
  },
  {
    id: 5,
    type: 'oneliner',
    answer: 'spammyspam@spam.sp',
    questionHeader: 'Your email adderess?',
  },
]

const newRequestContext = (playwright) =>
  playwright.request.newContext({ baseURL: test.info().project.use.baseURL })

const emptyConfiguration = (name) => ({
  name,
  content: '',
  registration_question_set_id: null,
  review_question_set1_id: null,
  review_question_set2_id: null,
  customer_review_question_set_id: null,
})

const topicContent = (title, customerName, email) => ({
  title,
  customerName,
  email,
  description: 'Decription..',
  environment: 'Webbi',
  specialRequests: '',
  additionalInfo: '',
})

test.describe('Customer review is shown', () => {
  let locals = {}

  test.beforeAll(async ({ playwright }) => {
    const request = await newRequestContext(playwright)

    const conf1 = await createConfiguration(request, emptyConfiguration('Konfiguraatio A'))
    const conf2 = await createConfiguration(request, emptyConfiguration('Conf 2'))

    const conf1_topic1 = await createTopic(
      request,
      topicContent('Konfiguraatio A Topic A', 'Super nice customer', 'asiakas@cee'),
      conf1.id,
    )
    const conf1_topic1_group = await createGroup(request, {
      name: 'Group of Konfiguraatio A Topic A',
      topicId: conf1_topic1.id,
      configurationId: conf1.id,
      instructorId: null,
      studentIds: ['012345678', '012345698'],
    })

    const conf2_topic1 = await createTopic(
      request,
      topicContent('Conf 2 Topic A', 'Super nice customer', 'asiakas@cee'),
      conf2.id,
    )
    const conf2_topic2 = await createTopic(
      request,
      topicContent('Conf 2 Topic B', 'Super mad customer', 'aasiakas@bee'),
      conf2.id,
    )
    const conf2_topic1_group = await createGroup(request, {
      name: 'Group of Conf 2 Topic A',
      topicId: conf2_topic1.id,
      configurationId: conf2.id,
      instructorId: null,
      studentIds: ['012345678', '012345698'],
    })
    const conf2_topic2_group = await createGroup(request, {
      name: 'Group of Conf 2 Topic B',
      topicId: conf2_topic2.id,
      configurationId: conf2.id,
      instructorId: null,
      studentIds: ['012345678', '012345698'],
    })

    // don't create review for conf2_topic2_group
    for (const group of [conf1_topic1_group, conf2_topic1_group]) {
      await createCustomerReview(request, {
        answer_sheet: mockAnswers,
        group_id: group.id,
        topic_id: group.topicId,
        configuration_id: group.configurationId,
      })
    }

    locals = {
      conf1,
      conf2,
      conf1_topic1,
      conf1_topic1_group,
      conf2_topic1,
      conf2_topic2,
      conf2_topic1_group,
      conf2_topic2_group,
    }
    await request.dispose()
  })

  test('admin can visit customer reviews page', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('adminstration/customer-reviews')
    await expect(page.getByText('Customer reviews').first()).toBeVisible()
  })

  test('all configurations are shown', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('adminstration/customer-reviews')
    await expect(page.getByText('Customer reviews').first()).toBeVisible()
    await page.locator('[data-cy="customer-reviews-select"]').click()
    await page.locator('[data-cy="all-configurations"]').click()

    const { conf1_topic1_group, conf2_topic1_group, conf2_topic2_group } = locals

    await expect(page.getByText(conf1_topic1_group.name).first()).toBeVisible()
    await expect(page.getByText(conf2_topic1_group.name).first()).toBeVisible()
    await expect(page.getByText(conf2_topic2_group.name).first()).toBeVisible()
  })

  test('customer reviews for configuration 1 are shown', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('adminstration/customer-reviews')
    await page.locator('[data-cy="customer-reviews-select"]').click()
    await page.locator('[data-cy="Konfiguraatio A"]').click()

    const { conf1_topic1_group } = locals

    await expect(page.getByText(conf1_topic1_group.name).first()).toBeVisible()
  })

  test('customer reviews for configuration 2 are shown', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('adminstration/customer-reviews')
    await page.locator('[data-cy="customer-reviews-select"]').click()
    await page.locator('[data-cy="Conf 2"]').click()

    const { conf2_topic1_group, conf2_topic2_group } = locals

    await expect(page.getByText(conf2_topic1_group.name).first()).toBeVisible()
    await expect(
      page.getByText('No review submitted for group ' + conf2_topic2_group.name).first(),
    ).toBeVisible()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await newRequestContext(playwright)
    const { conf1, conf2 } = locals
    await deleteConfiguration(request, conf1.id)
    await deleteConfiguration(request, conf2.id)
    await request.dispose()
  })
})
