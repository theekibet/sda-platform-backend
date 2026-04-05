import { Module } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';
import { DiscussionCommentsService } from './comments/discussion-comments.service';
import { DiscussionCommentsController, CommentsController } from './comments/discussion-comments.controller';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [TagsModule],
  providers: [
    DiscussionsService,
    DiscussionCommentsService,
  ],
  controllers: [
    DiscussionsController,
    DiscussionCommentsController,
    CommentsController,
  ],
  exports: [DiscussionsService, DiscussionCommentsService],
})
export class DiscussionsModule {}