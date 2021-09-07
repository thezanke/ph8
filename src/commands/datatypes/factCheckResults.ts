export type FactCheckClaimReview = {
  languageCode: string;
  publisher: {
    name: string;
    site: string;
  };
  reviewDate: string;
  textualRating: string;
  title: string;
  url: string;
};

export type FactCheckClaim = {
  claimDate: string;
  claimReview: FactCheckClaimReview[];
  text: string;
};

export type FactCheckResults = {
  claims?: FactCheckClaim[];
  nextPageToken?: string;
};
