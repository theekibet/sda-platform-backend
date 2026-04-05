import { IsInt, Min, Max } from 'class-validator';

export class DiscussionVoteDto {
  @IsInt()
  @Min(0)
  @Max(1)
  value: number; // 1 = upvote, 0 = remove vote
}