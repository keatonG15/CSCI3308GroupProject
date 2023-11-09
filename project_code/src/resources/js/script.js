async function test(answer, correctAnswer){
    const ans = {answer: answer, correctAnswer: correctAnswer}
    const test = await fetch('http://localhost:3000/verifyAnswer', {
      method: 'POST',
      headers: {
      "Content-Type": "application/json",
      },
      body:JSON.stringify(ans)
    })
    const result = await test.text();
   // location.reload();
    document.open();
    document.write(result);
    document.close();
  }

  //hyperplexed for CSS