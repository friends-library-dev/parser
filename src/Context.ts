import { Token } from './types';

export default class Context {
  public classList: string[] = [];
  public type?: 'quote' | 'verse' | 'epigraph' | 'discrete';
  public id?: string;
  public quoteAttribution?: Token[];
  public quoteSource?: Token[];
  public shortTitle?: Token[];

  public isBlockQuote(): boolean {
    return this.type === `quote` || this.type === `epigraph`;
  }
}
