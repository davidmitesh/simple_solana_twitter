import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import {  TwitterAnchorProgram} from '../target/types/twitter_anchor_program';
import * as assert from "assert";

describe('twitter_anchor_program', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.TwitterAnchorProgram as Program<TwitterAnchorProgram>


  it('can send a new tweet', async () => {
    // Add your test here.
    const tweet = anchor.web3.Keypair.generate();
    
    await program.rpc.sendTweet('Rust', 'The best systems programming language ever!', {
      accounts: {
          tweet : tweet.publicKey,
          author: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,

      },
      signers: [
          tweet
      ],
  });

  // Fetch the account details of the created tweet.
  const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  console.log(tweetAccount);
   // Ensure it has the right data.
   assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
   assert.equal(tweetAccount.topic, 'Rust');
   assert.equal(tweetAccount.content, 'The best systems programming language ever!');
   assert.ok(tweetAccount.timestamp);
  });


  it('can send a new tweet from next user account', async () => {
    // Add your test here.
    const tweet = anchor.web3.Keypair.generate();
    const newUser = anchor.web3.Keypair.generate();
    const signature =  await program.provider.connection.requestAirdrop(newUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);
    await program.rpc.sendTweet('Rust', 'The best systems programming language ever!', {
      accounts: {
          tweet : tweet.publicKey,
          author: newUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,

      },
      signers: [
          tweet,
          newUser
      ],
  });

  // Fetch the account details of the created tweet.
  const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  console.log(tweetAccount);
   // Ensure it has the right data.
   assert.equal(tweetAccount.author.toBase58(), newUser.publicKey.toBase58());
   assert.equal(tweetAccount.topic, 'Rust');
   assert.equal(tweetAccount.content, 'The best systems programming language ever!');
   assert.ok(tweetAccount.timestamp);
  });

  it('cannot provide a topic with more than 50 characters', async () => {
    
    try {
      const tweet_second = anchor.web3.Keypair.generate();
      const topicWith51Chars = 'x'.repeat(51);
      await program.rpc.sendTweet(topicWith51Chars, 'Hummus, am I right?', {
        accounts: {
            tweet: tweet_second.publicKey,
            author: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet_second],
    });
    }catch({error}){
      
      assert.equal(error.errorMessage, 'The provided topic should be 50 characters long maximum.');
      return;
    }
    assert.fail('The instruction should have failed with a 51-character topic.');
  });
});
