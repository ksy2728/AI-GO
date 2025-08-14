'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import { 
  X, ExternalLink, Calendar, User, Eye, Clock, Tag,
  Rocket, TrendingUp, Users, AlertCircle, Building, Newspaper
} from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  author: string
  publishedAt: string
  category: 'release' | 'research' | 'funding' | 'partnership' | 'regulation' | 'market'
  tags: string[]
  url: string
  imageUrl?: string
  readTime: number
  views: number
}

interface NewsArticleModalProps {
  article: NewsArticle | null
  onClose: () => void
}

export function NewsArticleModal({ article, onClose }: NewsArticleModalProps) {
  if (!article) return null

  const getCategoryIcon = (category: string): ReactNode => {
    switch (category) {
      case 'release': return <Rocket className="w-5 h-5" />
      case 'research': return <Eye className="w-5 h-5" />
      case 'funding': return <TrendingUp className="w-5 h-5" />
      case 'partnership': return <Users className="w-5 h-5" />
      case 'regulation': return <AlertCircle className="w-5 h-5" />
      case 'market': return <Building className="w-5 h-5" />
      default: return <Newspaper className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'release': return 'bg-green-100 text-green-800 border-green-200'
      case 'research': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'funding': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'partnership': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'regulation': return 'bg-red-100 text-red-800 border-red-200'
      case 'market': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleExternalLink = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  // Generate expanded content for demonstration
  const getExpandedContent = () => {
    const baseContent = article.content
    
    // Add more realistic content based on category
    switch (article.category) {
      case 'release':
        return `${baseContent}

This latest release represents a significant milestone in AI development, introducing capabilities that were previously thought to be years away. The new features include:

• Enhanced multimodal processing capabilities
• Improved reasoning and logical inference
• Better context understanding and retention
• More accurate and nuanced responses
• Advanced safety and alignment features

The development team has been working on these improvements for over 18 months, conducting extensive testing and validation to ensure reliability and safety. Early beta users have reported significant improvements in performance across various use cases.

Industry experts are calling this release a game-changer, with potential applications spanning from creative writing and code generation to scientific research and business analysis. The implications for enterprise adoption are particularly noteworthy, as the enhanced capabilities address many of the concerns previously raised by large-scale users.

The rollout will be gradual, starting with existing API customers before expanding to broader availability. The company has also announced plans for additional developer tools and resources to help teams integrate these new capabilities effectively.`

      case 'funding':
        return `${baseContent}

The funding round was significantly oversubscribed, with participation from both strategic and financial investors. The round was led by several major technology companies and venture capital firms, demonstrating strong confidence in the company's vision and execution capabilities.

Key details of the funding include:
• Total amount: Multiple billions in Series C funding
• Lead investors: Major technology corporations and top-tier VC firms
• Strategic partnerships: Integration agreements with cloud providers
• Valuation: Significant increase from previous rounds
• Use of funds: Research, development, and scaling operations

The company plans to use the funding to accelerate research and development efforts, expand its team of world-class researchers and engineers, and scale its infrastructure to meet growing demand. A significant portion will also be allocated to safety research and responsible AI development initiatives.

This funding round reflects the growing recognition of the strategic importance of advanced AI systems. The investment will enable the company to maintain its position at the forefront of AI research while ensuring responsible development and deployment practices.

The company's leadership has emphasized that the funding will support both near-term product development and long-term research into artificial general intelligence (AGI), with a continued focus on safety and beneficial applications for humanity.`

      case 'research':
        return `${baseContent}

This groundbreaking research addresses one of the most critical challenges in modern AI development: ensuring that advanced AI systems remain safe, beneficial, and aligned with human values as they become more capable.

The research findings include:
• Novel approaches to AI alignment and safety
• Methods for maintaining human oversight in autonomous systems
• Techniques for preventing harmful or unintended behaviors
• Frameworks for ethical AI development and deployment
• Validation methods for AI system reliability

The research team conducted extensive experiments across multiple AI architectures and use cases, collaborating with leading institutions and experts in the field. The work builds upon years of foundational research in AI safety and represents a significant step forward in making AI systems more reliable and trustworthy.

Peer review from the academic community has been overwhelmingly positive, with several independent research groups already beginning to implement and extend these findings. The methodology and results have been published in full detail to enable broader adoption and further research.

The implications of this research extend beyond individual AI systems to the broader ecosystem of AI development. The frameworks and principles outlined in this work are expected to influence industry standards and regulatory approaches to AI safety and governance.`

      default:
        return `${baseContent}

This development represents a significant shift in the AI landscape, with far-reaching implications for the industry and society as a whole. The announcement has generated considerable discussion among researchers, developers, and policymakers.

Key aspects of this development include:
• Immediate impact on current AI applications
• Long-term implications for the industry
• Potential benefits and challenges
• Regulatory and ethical considerations
• Market response and competitive dynamics

The broader AI community has responded with a mix of excitement and cautious optimism. While the potential benefits are clear, experts are also emphasizing the importance of responsible development and deployment practices.

Industry analysts predict that this development will accelerate adoption of AI technologies across various sectors, while also highlighting the need for updated governance frameworks and safety standards.

The coming months will be crucial for understanding the full impact of this development and how it will shape the future direction of AI research and application.`
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-3">
              {getCategoryIcon(article.category)}
              <Badge className={`${getCategoryColor(article.category)} border`}>
                <span className="capitalize">{article.category}</span>
              </Badge>
              <span className="text-sm text-gray-500">{formatRelativeTime(article.publishedAt)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{article.title}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Article Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Source</div>
                <div className="text-sm font-medium">{article.source}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Author</div>
                <div className="text-sm font-medium">{article.author}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Read Time</div>
                <div className="text-sm font-medium">{article.readTime} min</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Views</div>
                <div className="text-sm font-medium">{article.views.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Article Summary */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{article.summary}</p>
            </CardContent>
          </Card>

          {/* Article Content */}
          <div className="prose prose-gray max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-line">
              {getExpandedContent()}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Tag className="w-4 h-4" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* External Link */}
          <div className="pt-4 border-t">
            <Button onClick={handleExternalLink} className="w-full sm:w-auto">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original Article
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Published {formatRelativeTime(article.publishedAt)}</span>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}