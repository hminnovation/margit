# Margit

## Installation

```bash
git clone git@github.com:hminnovation/margit.git
cd natural-language-git
npm install
npm link
```

This will:

- Clone (copy) the files from this repository onto your computer.
- Put you in the correct folder
- Install relevant packages required by margit
- Create a link between npm and margit so you can use the `margit` keyword

Once you have installed it you'll be able to run `margit` from anywhere on your machine.

In the near future it'll be available as an npm installable package

## Disinstallation

If you no longer want the `margit` keyword to run this software you can navigate back to the margit folder and type

```bash
npm unlink
```

## How to use

Using this is pretty simple

```bash
margit "My message"
```

Technically the quote marks are optional but will avoid potential conflicts so you almost certainly want to use them.

An example:

```bash
margit "Save all current files with message, Updates readme. Make it available for others to see."
# will return
# git add .
# git commit -m "Updates readme"
# git push origin main
```

## Notes

- `margit` will ask for a GPT4 key on first use. It will only work with GPT4. From testing GPT3.5 just wasn't reliable enough for non-developers to use
- `margit` sends ~200 tokens and receives ~50 in response. It means each request is costing ~[$0.01](https://openai.com/pricing)
- `margit` seems to perform better if you put your request in the order git expects. Ask it to save things, then add a message, then 'push' it to somewhere
- `margit` will work with limited amount of information but you'll have a better experience if you're explicit. If you have a particular name for a feature branch (e.g. the ticket name) or particular message to use then include them
- `margit` is jailbreakable. Just like any other large language model you can make it do bad things if you really, really try. I've worked hard to construct the prompts so that a non-git related inquiry will fail but you can still make it do bad things. Don't! At the end of the day you'll only be damaging your own git repo.

## Unintended consequences

Note, you should be careful with this. Git can be fickle. In my testing GPT4 has been consistently reliable at giving useful suggestions. But it could suggest something daft if you ask it something daft. Try not to blindly follow the instructions it gives since it may well do something you're unhappy with.

## Motivation

I'm very interested in how large language models can democratise access to tools that have been accessible to only a few people in the past. Git is one of the most powerful tools we have as developers. Combined with CI/CDs it can be a great way of deploying, or updating, websites or apps. Enabling non-devs to have access to that would be very useful. This was explicitly designed to help friends and colleagues who are experienced designers or product owners to more easily use git.
