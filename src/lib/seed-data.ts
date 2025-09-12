import { prisma } from './db'

export async function seedSampleData() {
  try {
    // Create sample topics
    const contextEngineeringTopic = await prisma.topic.create({
      data: {
        name: 'Context Engineering',
        description: 'Terms and concepts related to prompt engineering and LLM context management',
        color: '#3B82F6',
        icon: '🤖'
      }
    })

    const webDevTopic = await prisma.topic.create({
      data: {
        name: 'Web Development',
        description: 'Frontend and backend web development concepts',
        color: '#10B981',
        icon: '💻'
      }
    })

    // Create sample lists for Context Engineering
    const ceBasicsList = await prisma.list.create({
      data: {
        topicId: contextEngineeringTopic.id,
        name: 'CE Basics',
        version: 1,
        source: 'UPLOAD'
      }
    })

    // Add items to CE Basics
    await prisma.listItem.createMany({
      data: [
        {
          listId: ceBasicsList.id,
          answer: 'PRIMER',
          clue: 'Short context to orient a model before tasks',
          difficulty: 'EASY'
        },
        {
          listId: ceBasicsList.id,
          answer: 'SYSTEMPROMPT',
          clue: 'Top-level instruction guiding model behavior',
          difficulty: 'MEDIUM'
        },
        {
          listId: ceBasicsList.id,
          answer: 'FEWSHOT',
          clue: 'Supplying examples to condition outputs',
          difficulty: 'MEDIUM'
        },
        {
          listId: ceBasicsList.id,
          answer: 'TEMPLATE',
          clue: 'Reusable prompt structure with slots',
          difficulty: 'EASY'
        },
        {
          listId: ceBasicsList.id,
          answer: 'GUARDRAILS',
          clue: 'Constraints to keep outputs safe and on-policy',
          difficulty: 'HARD'
        },
        {
          listId: ceBasicsList.id,
          answer: 'RETRIEVER',
          clue: 'Component that fetches relevant docs',
          difficulty: 'MEDIUM'
        },
        {
          listId: ceBasicsList.id,
          answer: 'CHUNKING',
          clue: 'Breaking documents into manageable slices',
          difficulty: 'MEDIUM'
        },
        {
          listId: ceBasicsList.id,
          answer: 'EMBEDDING',
          clue: 'Vector representation of text for similarity',
          difficulty: 'HARD'
        },
        {
          listId: ceBasicsList.id,
          answer: 'CONTEXT',
          clue: 'Information provided to guide model reasoning',
          difficulty: 'EASY'
        },
        {
          listId: ceBasicsList.id,
          answer: 'TOKENLIMIT',
          clue: 'Maximum input size constraint for models',
          difficulty: 'MEDIUM'
        }
      ]
    })

    // Create sample list for Web Development
    const webBasicsList = await prisma.list.create({
      data: {
        topicId: webDevTopic.id,
        name: 'Frontend Fundamentals',
        version: 1,
        source: 'UPLOAD'
      }
    })

    // Add items to Web Development
    await prisma.listItem.createMany({
      data: [
        {
          listId: webBasicsList.id,
          answer: 'HTML',
          clue: 'Markup language for web page structure',
          difficulty: 'EASY'
        },
        {
          listId: webBasicsList.id,
          answer: 'CSS',
          clue: 'Styling language for web page appearance',
          difficulty: 'EASY'
        },
        {
          listId: webBasicsList.id,
          answer: 'JAVASCRIPT',
          clue: 'Dynamic scripting language for web interactivity',
          difficulty: 'EASY'
        },
        {
          listId: webBasicsList.id,
          answer: 'REACT',
          clue: 'Popular JavaScript library for building UIs',
          difficulty: 'MEDIUM'
        },
        {
          listId: webBasicsList.id,
          answer: 'COMPONENT',
          clue: 'Reusable piece of UI in modern frameworks',
          difficulty: 'MEDIUM'
        },
        {
          listId: webBasicsList.id,
          answer: 'STATE',
          clue: 'Data that can change over time in an app',
          difficulty: 'MEDIUM'
        },
        {
          listId: webBasicsList.id,
          answer: 'PROPS',
          clue: 'Data passed to components in React',
          difficulty: 'MEDIUM'
        },
        {
          listId: webBasicsList.id,
          answer: 'HOOK',
          clue: 'Function that lets you use state in functional components',
          difficulty: 'HARD'
        },
        {
          listId: webBasicsList.id,
          answer: 'DOM',
          clue: 'Document Object Model - browser API for HTML',
          difficulty: 'MEDIUM'
        },
        {
          listId: webBasicsList.id,
          answer: 'API',
          clue: 'Interface for different software components to communicate',
          difficulty: 'EASY'
        },
        {
          listId: webBasicsList.id,
          answer: 'JSON',
          clue: 'JavaScript Object Notation data format',
          difficulty: 'EASY'
        },
        {
          listId: webBasicsList.id,
          answer: 'AJAX',
          clue: 'Technique for asynchronous web requests',
          difficulty: 'MEDIUM'
        }
      ]
    })

    console.log('✅ Sample data seeded successfully!')
    console.log(`- Created ${2} topics`)
    console.log(`- Created ${2} lists`)
    console.log(`- Created ${22} list items`)
    
    return {
      topics: [contextEngineeringTopic, webDevTopic],
      lists: [ceBasicsList, webBasicsList]
    }
  } catch (error) {
    console.error('Failed to seed sample data:', error)
    throw error
  }
}

export async function clearAllData() {
  try {
    // Delete in correct order due to foreign key constraints
    await prisma.solve.deleteMany({})
    await prisma.puzzle.deleteMany({})
    await prisma.listItem.deleteMany({})
    await prisma.list.deleteMany({})
    await prisma.topic.deleteMany({})
    
    console.log('✅ All data cleared successfully!')
  } catch (error) {
    console.error('Failed to clear data:', error)
    throw error
  }
}